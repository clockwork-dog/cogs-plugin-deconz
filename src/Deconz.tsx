import {
  useCogsConfig,
  useCogsConnection,
  useCogsInputPortValues,
} from "@clockworkdog/cogs-client-react";
import { useCallback, useEffect, useState } from "react";

export enum SensorValue {
  OnPressed = "On Pressed",
  OffPressed = "Off Pressed",
  OnLongPressed = "On Long Pressed",
  OffLongPressed = "Off Long Pressed",
}

interface CogsConnectionParams {
  config: {
    deconzHost: string;
    deconzPort: number;
    deconzApiKey: string;
  };
  inputPorts: {
    [name: string]: boolean;
  };
  outputEvents: {
    [name: string]: SensorValue | null;
  };
}

export default function Deconz() {
  const cogsConnection = useCogsConnection<CogsConnectionParams>();

  const { deconzHost, deconzPort, deconzApiKey } =
    useCogsConfig(cogsConnection);
  const apiBaseUrl = `http://${deconzHost}:${deconzPort}/api/${deconzApiKey}`;

  const endpoint = useCallback(
    (path: string) => {
      return apiBaseUrl + path;
    },
    [apiBaseUrl]
  );

  const [lights, setLights] = useState<{
    [lightId: string]: { name: string; state: { on?: boolean } };
  }>({});

  const updateAllLights = useCallback(async () => {
    const lights = await (await fetch(endpoint("/lights"))).json();
    setLights(lights);
  }, [endpoint]);

  const updateLight = useCallback(
    async (lightId: string) => {
      const light = await (await fetch(endpoint(`/lights/${lightId}`))).json();
      setLights((lights) => ({ ...lights, [lightId]: light }));
    },
    [endpoint]
  );

  const [sensors, setSensors] = useState<{
    [sensorId: string]: {
      name: string;
      config: { battery?: number };
      state?: { buttonevent: number };
    };
  }>({});

  const setLight = useCallback(
    async (lightId: string, on: boolean) => {
      await fetch(endpoint(`/lights/${lightId}/state`), {
        method: "PUT",
        body: JSON.stringify({ on }),
      });
    },
    [endpoint]
  );

  const getSensorStates = useCallback(async () => {
    const sensors = await (await fetch(endpoint("/sensors"))).json();
    setSensors(sensors);
  }, [endpoint]);

  const [websocketConnected, setWebsocketConnected] = useState(false);

  const [deconzWs, setDeconzWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!deconzWs) {
      return;
    }

    deconzWs.onopen = () => setWebsocketConnected(true);
    deconzWs.onclose = () => setWebsocketConnected(false);
    deconzWs.onmessage = async (message) => {
      const event = JSON.parse(message.data);

      if (event.e === "changed" && event.r === "lights") {
        updateLight(event.id);
      } else if (event.e === "changed" && event.r === "sensors") {
        const name = event.attr?.name ?? sensors[event.id].name;
        if (event.state) {
          setSensors((sensors) => ({
            ...sensors,
            [event.id]: { ...sensors[event.id], state: event.state },
          }));
          const value = sensorValue(event.state);
          // An event with no value will be followed by an event with a value
          if (value !== null) {
            cogsConnection.sendEvent(name, value);
          }
        }
      }
    };
  }, [
    cogsConnection,
    deconzHost,
    deconzApiKey,
    deconzWs,
    updateLight,
    endpoint,
    sensors,
  ]);

  useEffect(() => {
    if (deconzHost && deconzApiKey) {
      (async () => {
        const config = await (await fetch(endpoint("/config"))).json();
        const websocketPort = config.websocketport as number;
        setDeconzWs(new WebSocket("ws://" + deconzHost + ":" + websocketPort));
        updateAllLights();
        getSensorStates();
      })();
    }
  }, [deconzHost, deconzApiKey, endpoint, updateAllLights, getSensorStates]);

  const inputPorts = useCogsInputPortValues(cogsConnection);

  useEffect(() => {
    for (const [lightName, on] of Object.entries(inputPorts)) {
      const [lightId, light] =
        Object.entries(lights).find(([, light]) => light.name === lightName) ??
        [];
      if (lightId && light?.state.on !== on) {
        setLight(lightId, on);
      }
    }
  }, [inputPorts, lights, setLight]);

  return (
    <div>
      <p>DECONZ connected: {websocketConnected.toString()}</p>
      <h2>Lights</h2>
      <ul>
        {Object.entries(lights).map(([lightId, light]) =>
          light.state.on !== undefined ? (
            <li key={lightId}>
              <input
                type="checkbox"
                checked={light.state.on}
                onChange={() => setLight(lightId, !light.state.on)}
              />
              &nbsp;
              {light.name}
            </li>
          ) : null
        )}
      </ul>
      <h2>Sensors</h2>
      <ul>
        {Object.entries(sensors).map(([sensorId, sensor]) => {
          const value = sensorValue(sensor.state);
          return (
            <li key={sensorId}>
              {typeof value === "boolean" && (
                <input type="checkbox" checked={value} onChange={() => {}} />
              )}
              &nbsp;
              {sensor.name}
              {typeof sensor.config.battery === "number" &&
                ` - 🔋 ${sensor.config.battery ?? "?"}%`}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SENSOR_VALUE_SHORT_PRESS_ON = 1002;
const SENSOR_VALUE_SHORT_PRESS_OFF = 2002;
const SENSOR_VALUE_LONG_PRESS_ON = 1001;
const SENSOR_VALUE_LONG_PRESS_OFF = 2001;

function sensorValue(
  state: { buttonevent: number } | undefined
): SensorValue | null {
  switch (state?.buttonevent) {
    case SENSOR_VALUE_SHORT_PRESS_OFF:
      return SensorValue.OffPressed;
    case SENSOR_VALUE_SHORT_PRESS_ON:
      return SensorValue.OnPressed;
    case SENSOR_VALUE_LONG_PRESS_OFF:
      return SensorValue.OffLongPressed;
    case SENSOR_VALUE_LONG_PRESS_ON:
      return SensorValue.OnLongPressed;
    default:
      return null;
  }
}

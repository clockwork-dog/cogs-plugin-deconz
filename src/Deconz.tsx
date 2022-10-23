import {
  useCogsConfig,
  useCogsConnection,
  useCogsInputPortValues,
} from "@clockworkdog/cogs-client-react";
import { useCallback, useEffect, useState } from "react";

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
    [name: string]: boolean | null;
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
      // console.log(event);

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
          cogsConnection.sendEvent(name, value);
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

function sensorValue(
  state: { buttonevent: number } | undefined
): boolean | null {
  return state?.buttonevent === 1002
    ? true
    : state?.buttonevent === 2002
    ? false
    : null;
}

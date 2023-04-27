import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { storages } from "./storage";
import { Config } from "./types";

const offsets = Array.from({ length: 15 }, (_, i) => i + 1).map((i) => {
  return {
    minute: i,
    ms: i * 60 * 1000,
  };
});

const Options = () => {
  const [config, setConfig] = useState<Config | undefined>(undefined);

  const save = async () => {
    if (config == null) return;
    await storages.setConfig(config);
  };

  useEffect(() => {
    (async () => {
      const config = await storages.getConfig();
      setConfig(config);
    })();
  }, []);

  return (
    <div className="relative w-[480px] px-3 bg-slate-800 p-5">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Offset (minute)</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={config?.offset}
          onChange={(e) => {
            setConfig((prev) => {
              return { ...prev, offset: Number(e.currentTarget.value) };
            });
          }}
        >
          {offsets.map((offset) => (
            <option value={offset.ms * 60 * 1000}>{offset.minute}</option>
          ))}
        </select>

        {/* <input
          type="number"
          value={config?.offset}
          className="input input-bordered w-full max-w-xs"
          onChange={(e) => {
            setConfig((prev) => {
              const ms = e.currentTarget.valueAsNumber * 60 * 1000;
              return { ...prev, offset: ms };
            });
          }}
        /> */}
      </div>
      <button className="btn btn-primary mt-5 btn-sm" onClick={save}>
        Save
      </button>
    </div>
  );
};

render(<Options />, document.body);

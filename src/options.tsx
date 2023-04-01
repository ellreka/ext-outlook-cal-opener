import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { storages } from "./storage";
import { Config } from "./types";

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
          <span className="label-text">Offset (ms)</span>
        </label>
        <input
          type="number"
          value={config?.offset}
          className="input input-bordered w-full max-w-xs"
          onChange={(e) => {
            setConfig((prev) => {
              return { ...prev, offset: e.currentTarget.valueAsNumber };
            });
          }}
        />
      </div>
      <button className="btn btn-primary mt-5" onClick={save}>
        Save
      </button>
    </div>
  );
};

render(<Options />, document.body);

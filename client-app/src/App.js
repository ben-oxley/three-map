import React, { useEffect, useState } from 'react';
import useMqtt from './useMqtt'
import mqtt from 'mqtt';
import logo from './logo.svg';
import './App.css';
const layers = {
  Background: "background_",
  Slope: "slope",
  Hillshade: "hillshade",
  "Aerial Imagery": "ortho",
  Structures: "structures_",
  Paths: "paths_",
  "Buried Services": "services_",
  Water: "site_water_",
  DKs: "dk_",
  "NOC-Physical": "noc_",
  Power: "power_",
  Lighting: "lighting_",
  Villages: "villages_"
};

const layerIDs = {
  A: "Aerial Imagery",
  B: "Background",
  Bu: "Buried Services",
  D: "DKs",
  H: "Hillshade",
  L: "Lighting",
  N: "NOC-Physical",
  P: "Paths",
  Po: "Power",
  S: "Slope",
  St: "Structures",
  V: "Villages",
  W: "Water"
}
const effects = [
  "ascii",
  "dot",
  "pixel",
  "glitch"
]




function App() {
  const [layers_enabled, setLayers] = useState(["Background", "Structures", "Paths", "Villages"]);
  const { mqttSubscribe, mqttPublish, isConnected, payload } = useMqtt();
  const [effect, setEffect] = useState("");

  useEffect(() => {
    if (isConnected) {
      mqttSubscribe('#');
    }
  }, [isConnected]);

  useEffect(() => {
    if (payload.message
      && ['add', "remove", "state", "effect"].includes(payload.topic)
    ) {
      if (payload.topic == "add") {
        setLayers([
          ...layers_enabled,
          payload.message
        ])
      }
      if (payload.topic == "remove") {
        setLayers(
          layers_enabled.filter(a =>
            a !== payload.message
          )
        );
      }
      if (payload.topic == "state") {
        setLayers(
          payload.message.split(",").map(id => layerIDs[id])
        );
      }
      if (payload.topic == "effect") {
        setEffect(
          payload.message
        );
      }
    }
  }, [payload, layers_enabled]);



  function changeValue(el, value) {
    if (el.target.checked) {
      let layers = [
        ...layers_enabled,
        value
      ]
      setLayers(layers);
      let tags = layers.map(l => Object.entries(layerIDs).filter(([k, v]) => v == l).map(([k, v]) => k)[0]).join(",")
      mqttPublish('state', tags)
    } else {
      let layers = layers_enabled.filter(a =>
        a !== value
      )
      setLayers(layers);
      let tags = layers.map(l => Object.entries(layerIDs).filter(([k, v]) => v == l).map(([k, v]) => k)[0]).join(",")
      mqttPublish('state', tags)
    }
  }

  function changeEffect(el, value) {
    if (el.target.checked) {
      setEffect(value);
      mqttPublish('effect', value)
    } else {
      setEffect("");
      mqttPublish('effect', "none")
    }
  }




  return (
    <div className="App">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold py-8">EMF Interactive Map</h1>
        <div className='container flex flex-col space-y-4 items-center'>
          <div className="card w-96 bg-neutral text-neutral-content">
            <div className="card-body items-center text-center">
              <h1 className="text-2xl font-bold">Layers</h1>
              {Object.keys(layers).map(function (object, i) {
                return <div className="form-control w-52" key={i}>
                  <label className="cursor-pointer label">
                    <span className="label-text">{object} </span>
                    <input type="checkbox" className="toggle toggle-primary" onChange={(e) => changeValue(e, object)} checked={layers_enabled.includes(object)} />
                  </label>
                </div>
              })}
            </div>
          </div>
          <div className="card w-96 bg-neutral text-neutral-content">
            <div className="card-body items-center text-center">
              <h1 className="text-2xl font-bold">Effects</h1>
              {effects.map(function (object, i) {
                return <div className="form-control w-52" key={i}>
                  <label className="cursor-pointer label">
                    <span className="label-text">{object} </span>
                    <input type="checkbox" className="toggle toggle-primary" onChange={(e) => changeEffect(e, object)} checked={effect == object} />
                  </label>
                </div>
              })}
            </div>
          </div>
          <article className="prose">
            <h1>About</h1>
            <p>
              A 3D printed map of the site. Come add your tent to the map! The map will have live and interactive data layers projected over the top.

              The map is 1:426 scale and there will be some white clay to sculpt and add your stuff to the map and lots of standard tent shapes and sizes pre-printed.

              The whole map has been 3D printed based on the 2018, 25cm site LiDAR scan, merged with Environment Agency 1m LiDAR dsm.

              Uses three.js, react-three-fiber, @emfcamp/map, webrtc and hopefully leap motion/touchfree.

              Credit to James Harrison (talkunafraid.co.uk) for the Lidar data and Russ et al for the map layers and software.
            </p>

          </article>
        </div>
      </div>
    </div>
  );
}




export default App;

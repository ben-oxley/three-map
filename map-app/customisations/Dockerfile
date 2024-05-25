FROM emf-map as base

WORKDIR /app
COPY mqtt.ts src/mqtt.ts
RUN npm i -s mqtt@5.6.0
COPY mqtt.ts src/mqtt.ts
COPY exportmap.ts src/exportmap.ts
RUN sed -i -e "3i import { useMQTT } from './mqtt.ts'" src/index.ts
RUN sed -i -e "3i import { exportMap } from './exportmap.ts'" src/index.ts
RUN sed -i -e "111i preserveDrawingBuffer: true," src/index.ts
RUN sed -i -e '116i useMQTT(this.map,this.layer_switcher);' src/index.ts
RUN sed -i -e '116i exportMap(this.map);' src/index.ts
RUN sed -i -e "s/zoom: 16/zoom: 17.19/g" src/style/map_style.ts
RUN sed -i -e "s/bearing: 0/bearing: 25/g" src/style/map_style.ts
RUN sed -i -e "s/center: \[-2.3784, 52.0411\]/center: [-2.376986, 52.041328]/g" src/style/map_style.ts
RUN sed -i -e "s/width: 100%/width: 1080px/g" src/index.css
RUN sed -i -e "s/height: 100%/height: 1920px/g" src/index.css
RUN sed -i -e "s/overflow: hidden;//g" src/index.css

RUN npm run build

FROM emf-projection-map as render

FROM base as final
COPY --from=render /app/build /app/dist/render

CMD ["npm", "run", "serve"]
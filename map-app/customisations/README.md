docker build -t emf-map ../web
docker build -t emf-map-custom .
docker run -p 8080:8080 emf-map-custom
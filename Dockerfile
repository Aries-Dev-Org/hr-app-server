#instala la imagen de node correspondiente. En este aso, una generica:
FROM node:alpine 

#crea una carpeta en el contenedor donde se alojara la app:
WORKDIR /usr/src/app

#copia el package y lock en esa carpeta ( el . final hace referencia a la carpeta de workdir)
COPY package*.json .

#ejecuta la instalacion de las dependencias de los package anteriores
RUN npm ci

#copia todos los demas archivos en la carpeta ( por eso el  . . ) 
COPY . .

#Ejecuta el comando inicial
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]
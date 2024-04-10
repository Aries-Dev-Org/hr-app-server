const getTenant = (req) => {
  // Aquí se resuelve a que base de datos pegarle
  // Se toma el subdominio de la url origin
  const origin = req.get('Origin');
  const originMatch = origin?.match(/\/\/([^.]+)\./);
  const subDomain = originMatch ? originMatch[1] : null;

  // Finalmente se evalúa si se envía el tenant por headers (el caso de peticiones por postman)
  // Sino se toma el subdominio (el caso de peticiones desde el frontend)
  // Si no se encontraron ninguno de los 2 datos, simplemente se setea en null para que luego finalice con un error
  const tenant = req.headers.tenant || subDomain || null;

  return tenant;
};

module.exports = getTenant;

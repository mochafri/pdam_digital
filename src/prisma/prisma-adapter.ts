import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function getMariaDbAdapter() {
  const url = process.env.DATABASE_URL || "mysql://root:@localhost:3306/pdam_digital";
  
  // Format: mysql://user:password@host:port/database
  const matches = url.match(/mysql:\/\/([^:]*):?([^@]*)@([^:]*):?([^\/]*)\/(.*)/);
  if (!matches) {
    throw new Error(`Invalid DATABASE_URL: ${url}`);
  }
  
  const [, user, password, host, port, database] = matches;
  
  return new PrismaMariaDb({
    host: host || "localhost",
    port: port ? parseInt(port) : 3306,
    user: user || "root",
    password: password || "",
    database: database || "pdam_digital",
    connectionLimit: 10,
  });
}

import express from 'express';
import fs from 'fs';
import { ApolloServer } from 'apollo-server-express';

import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import InventoryAPI from './graphql/inventory.js';

const metaFile = './meta.json';
const metaStr = fs.readFileSync(metaFile, 'utf8');
console.log(`\nUsing meta values:\n${metaStr}\n\n`);
const meta = JSON.parse(metaStr);
if (!meta.inventoryAPIs || meta.inventoryAPIs.length === 0) {
  console.log('Fatal: At least one inventory API endpoint is needed');
  process.exit(-1);
}

const app = express();
const port = meta.port ? meta.port : 9002;
const namespace = meta.namespace ? meta.namespace : 'openshift-migration';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    inventoryAPI: new InventoryAPI(meta.inventoryAPIs, namespace),
  }),
});

server.applyMiddleware({ app, path: '/graphql' });

app.listen(port, () => console.log(`Listening on port ${port}`));

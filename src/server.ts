import express from 'express';
import { ApolloServer } from 'apollo-server-express';

import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import InventoryAPI from './graphql/inventory.js';
import { getMeta } from './graphql/discovery.js';

const inventory = getMeta();
console.log('meta.json: ', inventory);
const app = express();
const port = 9002;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    inventoryAPI: new InventoryAPI(inventory),
  }),
});

server.applyMiddleware({ app, path: '/graphql' });

app.listen(port, () => console.log(`Listening on port ${port}`));

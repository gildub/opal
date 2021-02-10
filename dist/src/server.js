import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './graphql/schema.js';
import resolvers from './graphql/resolvers.js';
import InventoryAPI from './graphql/inventory.js';
const app = express();
const port = 8080;
const inventoryURLs = [
    // 'https://forklift-inventory-openshift-migration.apps.cluster-fdupon.v2v.bos.redhat.com',
    'https://forklift-inventory-openshift-migration.apps.cluster-jortel.v2v.bos.redhat.com',
    'https://forklift-inventory-openshift-migration.apps.cluster-jortel.v2v.bos.redhat.com',
];
const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources: () => ({
        inventoryAPI: new InventoryAPI(inventoryURLs),
    }),
});
server.applyMiddleware({ app, path: '/graphql' });
app.get('/', (req, res) => res.send('Express + TypeScript Server'));
app.listen(port, () => console.log(`Listening on port ${port}`));
//# sourceMappingURL=server.js.map
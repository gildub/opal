import { readFileSync } from 'fs';
import k8s from '@kubernetes/client-node';

type MetaConfig = {
  url: string;
  namespace: string;
  configNamespace: string;
  clusterApi: string;
  inventoryApi: string;
  oauth: {
    clientId: string;
    redirectUrl: string;
    userScope: string;
    clientSecret: string;
  };
};

export type Meta = MetaConfig;

// const setConfigmapMeta: MetaConfig = defaultMeta;
const setConfigmapMeta = () => defaultMeta;

// fetch configmap.
const defaultMeta: MetaConfig = {
  url: 'https://forklift-inventory.openshift-migration.svc.cluster.local:8443',
  namespace: 'konveyor-forklift',
  configNamespace: 'konveyor-forklift',
  clusterApi: 'https://kubernetes.default.svc.cluster.local',
  inventoryApi: 'https://forklift-inventory.openshift-migration.svc.cluster.local:8443',
  oauth: {
    clientId: 'forklift-opal',
    redirectUrl:
      'https://virt-openshift-migration.apps.cluster-jortel.v2v.bos.redhat.com/login/callback',
    userScope: 'user:full',
    clientSecret: 'XXXXXXXXXXX',
  },
};

const cluster = {
  name: 'my-server',
  server: 'https://api.cluster-jortel.v2v.bos.redhat.com:6443',
};

const user = {
  name: 'forklift-ui',
  password: 'bWlncmF0aW9ucy5vcGVuc2hpZnQuaW8K',
};

const context = {
  name: 'opal',
  user: user.name,
  cluster: cluster.name,
};

const kc = new k8s.KubeConfig();
kc.loadFromOptions({
  clusters: [cluster],
  users: [user],
  contexts: [context],
  currentContext: context.name,
});

kc.loadFromFile('./kube.conf');

// Needed until Configmap ready
// const inventory = await getInventoryService('openshift-migration');
// console.log(inventory);

export const getInventoryService = async (namespace) => {
  const response = await getClusterServices(namespace);
  return response.items.filter(
    (item) => item.metadata && item.metadata.name === 'forklift-inventory'
  );
};

export const getInventory = () => {
  return getMeta();
};

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const getClusterServices = async (namespace) => {
  try {
    const response = await k8sApi.listNamespacedService(namespace).then((data) => data.body);
    return response;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const setDevMeta = () => {
  try {
    const file = readFileSync('./meta.dev.json', 'utf8');
    const devMeta = JSON.parse(file);
    return devMeta ? devMeta : null;
  } catch (err) {
    console.log('here');
    console.log(err);
    throw err;
  }
};

export const getMeta = (): Meta | null => {
  if (process.env['DEV'] === '1') {
    const devMeta = setDevMeta();
    return devMeta ? devMeta : null;
  }
  return setConfigmapMeta();
};

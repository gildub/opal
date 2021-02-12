export type API = {
  url: string;
  namespace: string;
};

export const inventoryAPIs: API[] = [
  {
    url: 'https://forklift-inventory-openshift-migration.apps.cluster-jortel.v2v.bos.redhat.com',
    namespace: 'openshift-migration',
  },
];

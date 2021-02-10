import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Link {
    kind: String
    id: String
  }

  union FolderGroup = Folder | VM | Datacenter | Cluster | Datastore | Network
  union ClusterGroup = Folder | Cluster
  union VMGroup = Folder | VM

  type VSphere {
    id: ID!
    kind: String
    url: String
    namespaces: [String]
    providers: [Provider]
  }

  type Provider {
    id: ID!
    name: String
    kind: String
    product: String
    vsphere: VSphere
    datacenters: [Datacenter]
  }

  type Folder {
    id: ID!
    kind: String
    name: String
    parent: Link
    children: [FolderGroup]
  }

  type Datacenter {
    id: ID!
    kind: String
    name: String
    parent: Link
    clusters: [ClusterGroup]
    vms: [VMGroup]
  }

  type Cluster {
    id: ID!
    kind: String
    name: String
    path: String
    datastores: [Datastore]
    networks: [Network]
    hosts: [Host]
    dasEnabled: Boolean
    dasVms: [String]
    drsEnabled: Boolean
    drsBehavior: String
    drsVms: [String]
  }

  type Datastore {
    id: ID!
    kind: String
    name: String
  }

  type Host {
    id: ID!
    name: String
    productName: String
    inMaintenance: Boolean
    cpuSockets: Int
    cpuCores: Int
    parent: Link
    path: String
    productVersion: String
    networking: Networking
    networks: [Network]
    datastores: [Datastore]
    vms(id: String, memoryMB: Int, powerState: String): [VM]
    networkAdapters: [NetworkAdapter]
  }

  type Network {
    id: ID!
    kind: String
    name: String
    parent: Folder
    path: String
    type: String
  }

  type Networking {
    vNICs: [VNIC]
    pNICs: [PNIC]
    portGroups: [PortGroup]
    switches: [Switch]
  }

  type VNIC {
    key: String
    linkSpeed: Int
  }

  type PNIC {
    key: String
    portGroup: String
    dPortGroup: String
    ipAddress: String
    mtu: Int
  }

  type PortGroup {
    key: String
    name: String
    vSwitch: String
  }

  type Switch {
    key: String
    name: String
    portGroups: [PortGroup]
    pNICs: [PNIC]
  }

  type NetworkAdapter {
    name: String
    ipAddress: String
    linkSpeed: Int
    mtu: Int
  }

  type VM {
    id: ID!
    kind: String
    name: String
    path: String
    revision: Int
    selfLink: String
    uuid: String
    firmware: String
    powerState: String
    cpuHotAddEnabled: Boolean
    cpuHotRemoveEnabled: Boolean
    memoryHotAddEnabled: Boolean
    faultToleranceEnabled: Boolean
    cpuCount: Int
    coresPerSocket: Int
    memoryMB: Int
    guestName: String
    balloonedMemory: Int
    ipAddress: String
    storageUsed: Int
    numaNodeAffinity: [String]
    devices: [Device]
    cpuAffinity: [Int]
    host(id: String): Host
    networks(id: String, type: String): [Network]
    revisionAnalyzed: Int
    disks: [Disk]
    concerns(label: String, category: String): [Concern]
  }

  type Device {
    Kind: String
  }

  type Disk {
    file: String
    datastore: Link
    capacity: Int
    shared: Boolean
    rdm: Boolean
  }

  type Concern {
    label: String
    category: String
    assessment: String
  }

  input VMFilter {
    id: String
    cpuHotAddEnabled: Boolean
    ipAddress: String
    powerState: String
    memoryMB: Int
  }

  input NetworkFilter {
    id: String
    type: String
  }

  type Query {
    vsphere(id: ID!): VSphere
    vspheres: [VSphere]
    folder(provider: String!, id: ID!): Folder
    folders(provider: String!): [Folder]
    provider(vsphere: Int!, name: String): Provider
    providers(vsphere: Int!): [Provider]
    datacenter(provider: String!, id: ID!): Datacenter
    datacenters(provider: String!): [Datacenter]
    cluster(provider: String!, id: ID!): Cluster
    clusters(provider: String!): [Cluster]
    datastore(provider: String!, id: ID!): Datastore
    datastores(provider: String!): [Datastore]
    host(provider: String!, id: ID!): Host
    hosts(provider: String!): [Host]
    network(provider: String!, id: ID!): Network
    networks(provider: String!, filter: NetworkFilter): [Network]
    vm(provider: String!, id: ID!): VM
    vms(provider: String!, filter: VMFilter): [VM]
  }
`;

export default typeDefs;

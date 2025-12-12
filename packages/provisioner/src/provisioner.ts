export interface ContainerInfo {
  clientId: string;
  expireTime: Date;
}

export interface ConnectionInfo {
  clientId: string;
  host: string;
  port: number;
  username: string;
}

export interface Provisioner {
  /**
   * List client IDs and expiration times for all containers.
   * @returns List of client IDs and expiration times
   */
  listContainers: () => Promise<ContainerInfo[]>;

  /**
   * Ensure a container exists for the given client ID.
   * If it does not exist, create it.
   * @param clientId Unique identifier for the client
   */
  ensureContainerExists: (clientId: string) => Promise<ConnectionInfo>;

  /**
   * Update the expiration time of an existing container.
   * @param clientId Unique identifier for the client
   */
  updateContainerExpiration: (clientId: string) => Promise<void>;

  /**
   * Delete a container and all associated resources.
   * @param clientId Unique identifier for the client
   */
  deleteContainer: (clientId: string) => Promise<void>;
}

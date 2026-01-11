export interface ContainerInfo {
  userId: string;
  expiresAt: Date;
}

export interface ConnectionInfo {
  userId: string;
  host: string;
  port: number;
  username: string;
  privateKey: string;
}

export interface Provisioner {
  /**
   * List user IDs and expiration times for all containers.
   * @returns List of user IDs and expiration times
   */
  listContainers: () => Promise<ContainerInfo[]>;

  /**
   * Ensure a container exists for the given user ID.
   * If it does not exist, create it.
   * @param userId Unique identifier for the user
   */
  ensureContainerExists: (userId: string) => Promise<ConnectionInfo>;

  /**
   * Update the expiration time of an existing container.
   * @param userId Unique identifier for the user
   */
  updateContainerExpiration: (userId: string) => Promise<void>;

  /**
   * Delete a container and all associated resources.
   * @param userId Unique identifier for the user
   */
  deleteContainer: (userId: string) => Promise<void>;
}

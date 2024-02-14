export class Permission {
  id?: string;
  displayName?: string;
    // user: full name of the user, as defined for the Google Account, such as "John Doe".
    // group: name of the Google Group, such as "Company Administrators".
    // domain – Domain name string, such as "thecompany.com".
    // anyone: there is no displayName.

  type: 'user' | 'group' | 'domain' | 'anyone';
  role: 'owner' | 'organizer' | 'fileOrganizer' | 'writer' | 'commenter' | 'reader';
  allowFileDiscovery?: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<Permission>) {
    if (!data.type || !data.role) {
      throw new Error("Missing required fields");
    }

    this.type = data.type;
    this.role = data.role;
    this.allowFileDiscovery = data.allowFileDiscovery;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

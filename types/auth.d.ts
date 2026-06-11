declare module "#auth-utils" {
  interface User {
    id: string;
    name: string;
    userPermissions: string[];
  }
  interface UserSession {
    odooPassword: string;
    odooUsername: string;
    currentCompanyId?: number;
  }
}

export {};

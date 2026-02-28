export interface AuthInfo {
  userId: number;
  userName: string;
  userEmail: string;
  userAdmin: boolean;
}

export interface User {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  userAdmin: boolean;
}

export interface Client {
  id: string;
  clientId: number;
  clientName: string;
  userId: number;
  clientPhone: string;
}

export interface Building {
  id: string;
  buildingId: number;
  buildingName: string;
  clientId: number;
  buildingAddress: string;
}

export interface Document {
  id: string;
  documentId: number;
  documentName: string;
  buildingId: number;
  documentFileName: string;
  documentFile?: string; // base64, only sent on upload
}

export interface Parameters {
  id: string;
  empName: string;
  empLogo: string; // base64
  empLogoName: string;
}

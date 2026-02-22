
export interface RichMenuSize {
  width: number;
  height: number;
}

export interface RichMenuArea {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  action: {
    type: string;
    label?: string;
    text?: string;
    uri?: string;
    data?: string;
  };
}

export interface RichMenuConfig {
  size: RichMenuSize;
  selected: boolean;
  name: string;
  chatBarText: string;
  areas: RichMenuArea[];
}

export enum AppStep {
  CONFIG = 0,
  JSON_DEFINITION = 1,
  IMAGE_UPLOAD = 2,
  PREVIEW_DEPLOY = 3
}

export interface LineAccountInfo {
  userId: string;
  basicId: string;
  displayName: string;
  pictureUrl: string;
}

export interface LineResponse {
  richMenuId?: string;
  message?: string;
}

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
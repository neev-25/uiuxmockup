import { createContext, Dispatch, SetStateAction } from "react";
import { SettingsDetail } from "@/type/types";

type SettingContextType = {
  settingsDetail: SettingsDetail | null;
  setSettingsDetail: Dispatch<SetStateAction<SettingsDetail | null>>;
};

export const SettingContext = createContext<SettingContextType>({
  settingsDetail: null,
  setSettingsDetail: () => {},
});

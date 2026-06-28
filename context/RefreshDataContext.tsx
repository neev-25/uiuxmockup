import { createContext, Dispatch, SetStateAction } from "react";
import { RefreshData } from "@/type/types";

type RefreshDataContextType = {
  refreshData: RefreshData | undefined;
  setRefreshData: Dispatch<SetStateAction<RefreshData | undefined>>;
};

export const RefreshDataContext = createContext<RefreshDataContextType>({
  refreshData: undefined,
  setRefreshData: () => {},
});

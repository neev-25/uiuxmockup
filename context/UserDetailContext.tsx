import { createContext, Dispatch, SetStateAction } from "react";
import { UserType } from "@/type/types";

type UserDetailContextType = {
  userDetail: UserType | undefined;
  setUserDetail: Dispatch<SetStateAction<UserType | undefined>>;
};

export const UserDetailContext = createContext<UserDetailContextType>({
  userDetail: undefined,
  setUserDetail: () => {},
});

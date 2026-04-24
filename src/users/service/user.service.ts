import type { IUser } from "../../interface/common";
import userModel from "../model/user.models";

class UserService {
  async register(data: IUser) {
    const { fullName, email, password, role } = data;
    const createUser = await userModel.create({
      fullName,
      email,
      password,
      role,
    });
    return createUser;
    
  }
}
export default UserService;

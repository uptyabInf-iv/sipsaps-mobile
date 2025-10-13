import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/userSlice';

export const useUser = () => {
  const dispatch = useDispatch();
  const { name, email } = useSelector((state) => state.user);

  const updateUser = (userData) => dispatch(setUser(userData));

  return { name, email, updateUser };
};
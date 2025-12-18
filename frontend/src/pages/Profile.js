import { useAuthContext } from '../hooks/useAuthContext'

const Profile = () => {
  const { user } = useAuthContext()

  return (
    <div className="profile">
      <h2>My Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  )
}

export default Profile
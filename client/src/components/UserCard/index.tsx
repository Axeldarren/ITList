import { User } from '@/state/api'
import Image from 'next/image'
import React from 'react'

type Props = {
    user: User
}

const UserCard = ({ user }: Props) => {
  return (
    <div
        className='flex items-center rounded border p-4 shadow'
    >
        {user.profilePictureUrl && (
            <Image
                src={`/${user.profilePictureUrl.replace(/^\/+/, '')}`}
                alt={`${user.username}'s profile picture`}
                width={50}
                height={50}
                className='rounded-full mr-4'
            />
        )}
        <div>
            <h3>{user.username}</h3>
            <p>{user.email}</p>
        </div>
    </div>
  )
}

export default UserCard
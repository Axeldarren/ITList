import { User } from '@/state/api'
import { getProfilePictureSrc } from '@/lib/profilePicture'
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
                src={getProfilePictureSrc(user.profilePictureUrl)!}
                alt={`${user.username}'s profile picture`}
                width={50}
                height={50}
                className='rounded-full mr-4 w-[50px] h-[50px] object-cover'
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
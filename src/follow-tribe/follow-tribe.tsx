import React, { useState } from 'react'
import { Client, PrivateKey } from 'dsteem';
import { Mainnet as NetConfig } from '../configuration'

import {
  Typography,
  Grid,
  Button,
  List,
  CircularProgress,
  Card
} from '@material-ui/core'


import Member from './member'

let opts = { ...NetConfig.net }

const DELAY = 700
let timeout = 0
const postingKey = process.env.REACT_APP_POSTING_KEY || ''
const username = process.env.REACT_APP_STEEM_USER

const client = new Client(NetConfig.url, opts);
const privateKey = PrivateKey.fromString(postingKey)


const FollowTribe: React.FC = () => {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([''])
  const [selectedMembers, setSelectedMembers] = useState(new Set(members))
  const [amount] = useState(1000)

  const getUserFollowing: any = async () => {

    const results = await fetch('https://api.steemit.com', {
      method: 'POST',
      body: `{"jsonrpc":"2.0", "method":"follow_api.get_following", "params":{"account":"${username}","start":null,"limit":205}, "id":1}`
    })
      .then(data => data.json())
      .catch(err => {
        setError(true)
        console.log('There was an error when fetching user followers: ' + err)
      })

    if (results) {
      const listOfUserFollowing = results.result.reduce((arr, current) => {
        return [...arr, current.following]
      }, [])

      return listOfUserFollowing
    } else {
      setError(true)
    }
    // console.log(results)
  }

  const handleFollow: any = async (event: React.FormEvent<HTMLInputElement>, handleLoading: any) => {
    event.preventDefault()
    setLoading(true)
    let follower = username
    const followMemberFunctions: any = []
    members.forEach(async (following) => {
      const json = JSON.stringify([
        'follow',
        {
          follower,
          following,
          what: ['blog'], //null value for unfollow, 'blog' for follow
        },
      ])

      const data: any = {
        id: 'follow',
        json: json,
        required_auths: [],
        required_posting_auths: [follower],
      }

      followMemberFunctions.push(() => {
        timeout = timeout + DELAY
        const fn = () => {
          return client.broadcast.json(data, privateKey).then(res => console.log(res)).catch(err => console.log(err))
        }
        setTimeout(fn, timeout)
      })
    })
    followMemberFunctions.push(() => setTimeout(handleLoading, timeout))
    followMemberFunctions.forEach((fn) => {
      fn()
      return
    })

  }

  const handleGetCommunity: any = async (getUserFollowingCallback: () => {}) => {
    const results = await fetch('https://api.steemit.com', {
      method: 'POST',
      body: '{"jsonrpc":"2.0", "method":"follow_api.get_following", "params":{"account":"tribesteemup","start":null,"limit":100}, "id":1}'
    })
      .then(data => data.json())
      .catch(err => {
        setError(true)
        console.log('There was an error when fetching: ' + err)
      })

    setLoading(false)

    if (results) {
      // Use a call back to get the users followers
      const currentUserFollowers: any = await getUserFollowingCallback()

      let listOfMembers: any = results.result.reduce((arr, current) => {
        return [...arr, current.following]
      }, [])

      // Make sure you aren't already following this member
      // We don't want to unfollow them.
      const listOfNewFollowers: any = listOfMembers.filter(newFollower => {
        // can't follow yourself
        if (newFollower === username) return false

        return !currentUserFollowers.includes(newFollower)
      })

      setMembers(listOfNewFollowers)
      setSelectedMembers(new Set(listOfNewFollowers))
    } else {
      setError(true)
    }
  }

  const handleChange: any = (member: string, value: boolean) => {
    const newSelectedMembers: any = new Set(selectedMembers)

    if (value) {
      newSelectedMembers.add(member)
    } else {
      newSelectedMembers.delete(member)
    }

    setSelectedMembers(newSelectedMembers)
  }

  React.useEffect(() => {
    handleGetCommunity(getUserFollowing)
  }, [])

  if (loading) {
    return (
      <Grid container justify="center" style={{ marginTop: 16 }}>
        <CircularProgress color="secondary" />
      </Grid>
    )
  }

  if (members.length === 0) {
    return (
      <Grid container justify="center" style={{ marginTop: 16 }}>
        <Card>
          <Typography align="center" style={{ padding: 16 }}>Congratulations! You are following all the members in abundance.tribe!</Typography>
        </Card>
      </Grid>
    )
  }

  const handleLoading: any = () => {
    handleGetCommunity(getUserFollowing)
    setLoading(false)
  }

  return (
    <>
      <Typography variant="h3" component="h2" align="center" style={{ marginTop: 16 }}>
        Members:
        </Typography>
      <form onSubmit={(event) => handleFollow(event, handleLoading)}>
        {error && <Typography variant="h5" align="center" style={{ marginTop: 16, marginBottom: 16 }}>Unable to Reach Steem API</Typography>}
        {
          !error && loading
            ?
            <div></div>
            :
            <List style={{ overflow: 'auto', height: 200 }} aria-label="list of members">
              {
                members.map((member: string) => (
                  <Member
                    key={member}
                    member={member}
                    selected={selectedMembers.has(member)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleChange(member, event.target.checked)}
                  />
                ))
              }
            </List>
        }
        <Grid
          container
          justify="space-between"
          alignItems="center"
          direction="row"
          style={{
            marginTop: 16
          }}>
          <Grid item style={{ marginTop: 8, marginBottom: 8 }}>
            <Typography>
              Steem Needed: {amount} (not yet available)
            </Typography>
          </Grid>
          <Grid item style={{ marginTop: 8, marginBottom: 8 }}>
            <Button type="submit" variant="contained" color="secondary">
              Follow
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  )
}

export default FollowTribe

import React from 'react'
import { AddressContainer, ContactContainer } from '../lib/unstated'
import { sampleAddresses } from '../common'
import { StateForm } from './states/StateForm'
import { StateSelector, StateContainer } from './StateSelector'
import { client } from '../lib/trpc'

const extraAddressData = {
  queryAddr: '100 S Biscayne Blvd, Miami, FL 33131, USA',
  fullAddr: '100 S Biscayne Blvd, Miami, FL 33131, USA',
  country: 'United States',
  postcode: '33131',
}

const RawMockPage: React.FC<{}> = () => {
  const { state } = StateContainer.useContainer()
  const { setAddress } = AddressContainer.useContainer()
  const { setContact } = ContactContainer.useContainer()

  React.useLayoutEffect(() => {
    (async () =>  {
      const bareAddress = sampleAddresses[state][0]
      const address = {
        ...extraAddressData,
        ...bareAddress
      }

      const result = await client.fetchContact(bareAddress)
      if (result.type === 'data') {
        setAddress(address)
        setContact(result.data)
      }
    })()
  }, [state, setAddress, setContact])

  return <StateForm/>
}

export const MockPage: React.FC<{}> = () => {
  if (!process.env.REACT_APP_MOCK) return null

  return <StateSelector>
    <RawMockPage/>
  </StateSelector>
}

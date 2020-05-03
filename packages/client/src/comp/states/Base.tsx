import React from 'react'
import Form from 'muicss/lib/react/form'
import Input from 'muicss/lib/react/input'
import SignatureCanvas from 'react-signature-canvas'


import { BaseInfo, uspsAddressOneLine, Locale, Address, StateInfo, State } from '../../common'
import { client } from '../../lib/trpc'
import { RoundedButton } from '../util/Button'
import { useControlRef } from '../util/ControlRef'
import { BaseInput, PhoneInput, EmailInput, NameInput, BirthDateInput } from '../util/Input'
import { Togglable } from '../util/Togglable'
import { useAppHistory } from '../../lib/path'
import { Signature } from '../util/Signature'

export type StatelessInfo = Omit<BaseInfo, 'state'>

type EnrichValues<Info> = (base: StatelessInfo) => Info | null

type Props<Info> = React.PropsWithChildren<{
  address: Address
  locale: Locale
  enrichValues: EnrichValues<Info>
}>

export const Base = <Info extends StateInfo>({address, locale, enrichValues, children }: Props<Info>) => {
  const { pushSuccess, oid } = useAppHistory()

  const nameRef = useControlRef<Input>()
  const birthdateRef = useControlRef<Input>()
  const emailRef = useControlRef<Input>()
  const phoneRef = useControlRef<Input>()
  const mailingRef = useControlRef<Input>()
  const signatureRef = React.useRef<SignatureCanvas>(null)

  const uspsAddress = address ? uspsAddressOneLine(address) : null
  const { city, county } = locale

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.persist()  // allow async function call
    event.preventDefault()
    if (!address || !uspsAddress) return  // TODO: Add warning

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please sign form')
      return
    }

    const baseInfo: StatelessInfo = {
      city,
      county,
      oid,
      name: nameRef.value() || '',
      birthdate: birthdateRef.value() || '',
      email: emailRef.value() || '',
      mailingAddress: mailingRef.value() || '',
      phone: phoneRef.value() || '',
      uspsAddress
    }

    const info = enrichValues(baseInfo)
    if (!info) return  // TODO: Add warning
    const result = await client.register(info)
    result.type === 'data' && pushSuccess(result.data)
    // TODO: Add warning if error
  }

  return <Form onSubmit={handleSubmit}>
    <NameInput
      id='name'
      ref={nameRef}
      required
    />
    <BirthDateInput
      id='birthdate'
      ref={birthdateRef}
      required
    />
    <EmailInput
      id='email'
      ref={emailRef}
      required
    />
    <PhoneInput
      id='tel'
      ref={phoneRef}
    />
    <Togglable
      id='separate'
      label='Mail My Ballot to a Separate Mailing Address'
    >{
      (checked) => <BaseInput
        id='mailing'
        label='Mailing Address'
        ref={mailingRef}
        required={checked}
      />
    }</Togglable>
    { children }

    <RoundedButton color='primary' variant='raised' data-testid='submit'>
      Send my application email
    </RoundedButton>
  </Form>
}

export type NoSignature<Info extends StateInfo> = Omit<Info, 'signature'>

export const SignatureBase = <Info extends StateInfo>(
  {address, locale, enrichValues, children}: Props<NoSignature<Info>>
) => {
  const signatureRef = React.useRef<SignatureCanvas>(null)

  const enrichValuesWithSignature = (baseInfo: StatelessInfo): Info | null => {
    const values = enrichValues(baseInfo)
    if (!values) return null

    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert('Please sign form')
      return null
    }

    return {
      ...baseInfo,
      ...values,
      signature: signatureRef.current.toDataURL(),
    } as Info  // hack b/c it cannot understand how to distribute over types
  }

  return <Base<Info>
    address={address}
    locale={locale}
    enrichValues={enrichValuesWithSignature}
  >
    { children }
    <Signature inputRef={signatureRef} label='Signature (use your Mouse or Finger)'/>
  </Base>
}

export type StateProps<S extends State> = React.PropsWithChildren<{
  address: Address
  locale: Locale<S>
}>

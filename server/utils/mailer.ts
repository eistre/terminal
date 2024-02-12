import { EmailClient, EmailMessage } from '@azure/communication-email'
import { Cron } from 'croner'
import dayjs from 'dayjs'

const AZURE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING || ''
const AZURE_SENDER = process.env.AZURE_SENDER || ''
const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN) || 20

const logger = pino.child({ caller: 'mailer' })

export const codeSent = new Set<string>()

function localeMessages (locale: string): string[] {
  if (locale === 'en') {
    return [
      'Verify your email address',
      'Hello,',
      'You recently signed up to the Linux command line practice environment.',
      'To verify this email, please use the verification code below:',
      'Kind regards,',
      'Linux terminal app'
    ]
  } else {
    return [
      'Kinnitage oma e-posti aadress',
      'Tere',
      'Registreerusite hiljuti Linuxi käsurea harjutuskeskkonda.',
      'Selle e-posti kinnitamiseks kasutage palun allolevat kinnituskoodi:',
      'Parimate soovidega',
      'Linux terminal rakendus'
    ]
  }
}

export async function sendMail (userId: string, token: string, recipient: string, locale: string, attempt: number = 1) {
  if (attempt > 5) {
    logger.warn(`Failed to send mail to recipient: ${recipient}`)
    return
  }

  const client = new EmailClient(AZURE_CONNECTION_STRING)

  const messages = localeMessages(locale)

  const message: EmailMessage = {
    senderAddress: AZURE_SENDER,
    content: {
      subject: messages[0],
      plainText: `${messages[1]}\n${messages[2]}\n${messages[3]}\n${token}\n${messages[4]}\n${messages[5]}`,
      html: `<html lang="${locale}">
                <body>
                <p>${messages[1]}</p>
                <p>${messages[2]}</p>
                <p>${messages[3]}</p>
                <h3>${token}</h3>
                <p>${messages[4]}</p>
                <p>${messages[5]}</p>
                </body>
            </html>`
    },
    recipients: { to: [{ address: recipient }] }
  }

  try {
    codeSent.add(userId)

    const poller = await client.beginSend(message)
    const response = await poller.pollUntilDone()

    Cron(dayjs().add(RESEND_COOLDOWN, 'minutes').toDate(), () => {
      codeSent.delete(userId)
    })

    logger.debug(`Operation ID: ${response.id}`)
  } catch (error) {
    codeSent.delete(userId)
    await sendMail(userId, token, recipient, locale, attempt + 1)
  }
}

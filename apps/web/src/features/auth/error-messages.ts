const messages: Readonly<Record<string, string>> = {
  invalid_credentials: 'Email ou senha incorretos.',
  email_not_confirmed: 'Confirme seu email para entrar.',
  user_already_exists: 'Já existe uma conta com este email. Entre ou recupere a senha.',
  email_exists: 'Já existe uma conta com este email. Entre ou recupere a senha.',
  weak_password: 'Escolha uma senha mais forte, com letras e números.',
  otp_expired: 'O código expirou ou não confere. Peça um novo.',
  same_password: 'A nova senha precisa ser diferente da anterior.',
  over_email_send_rate_limit: 'Muitos emails em pouco tempo. Espere um minuto e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Espere um pouco e tente de novo.',
}

export const genericAuthError = 'Não foi possível concluir agora. Tente de novo em instantes.'

export function authErrorMessage(code: string | undefined): string {
  return (code === undefined ? undefined : messages[code]) ?? genericAuthError
}

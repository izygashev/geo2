import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";

interface VerificationEmailProps {
  name?: string;
  verificationUrl?: string;
}

export default function VerificationEmail({
  name = "Пользователь",
  verificationUrl = "https://geostudioai.ru/verify?token=xxx",
}: VerificationEmailProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>Подтвердите ваш email-адрес — Geo Studio</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>Geo Studio</Text>

          <Heading style={heading}>Подтверждение email-адреса</Heading>

          <Text style={paragraph}>
            Привет, {name}!
          </Text>

          <Text style={paragraph}>
            Для завершения регистрации подтвердите ваш адрес электронной почты,
            нажав на&nbsp;кнопку ниже. Ссылка действительна в&nbsp;течение
            24&nbsp;часов.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={verificationUrl}>
              Подтвердить почту
            </Button>
          </Section>

          <Text style={mutedSmall}>
            Если кнопка не&nbsp;работает, скопируйте и&nbsp;вставьте эту ссылку
            в&nbsp;адресную строку браузера:
          </Text>
          <Text style={urlText}>{verificationUrl}</Text>

          <Hr style={hr} />

          <Text style={footer}>
            Если вы&nbsp;не&nbsp;регистрировались в&nbsp;Geo&nbsp;Studio,
            просто проигнорируйте это письмо.
          </Text>

          <Text style={footerMuted}>
            © {new Date().getFullYear()} Geo Studio · geostudioai.ru
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/* ───────── Styles ───────── */

const body: React.CSSProperties = {
  backgroundColor: "#F7F6F3",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  padding: "40px 0",
};

const container: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #EAEAEA",
  padding: "40px 32px",
};

const brand: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "#787774",
  textTransform: "uppercase",
  margin: "0 0 24px",
};

const heading: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 700,
  color: "#1a1a1a",
  lineHeight: "1.4",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.7",
  color: "#555555",
  margin: "0 0 14px",
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#111111",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 500,
  padding: "12px 28px",
  borderRadius: "8px",
  textDecoration: "none",
};

const mutedSmall: React.CSSProperties = {
  fontSize: "12px",
  color: "#787774",
  lineHeight: "1.5",
  margin: "0 0 4px",
};

const urlText: React.CSSProperties = {
  fontSize: "11px",
  color: "#BBBBBB",
  lineHeight: "1.4",
  wordBreak: "break-all",
  margin: "0 0 20px",
};

const hr: React.CSSProperties = {
  borderTop: "1px solid #EAEAEA",
  margin: "28px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#787774",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const footerMuted: React.CSSProperties = {
  fontSize: "11px",
  color: "#BBBBBB",
  margin: "0",
};

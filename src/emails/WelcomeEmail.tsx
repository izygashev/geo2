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

interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export default function WelcomeEmail({
  name = "Пользователь",
  dashboardUrl = "https://geostudioai.ru/dashboard",
}: WelcomeEmailProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>Добро пожаловать в Geo Studio — платформу AI-аналитики</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Logo / Brand */}
          <Text style={brand}>Geo Studio</Text>

          <Heading style={heading}>Добро пожаловать!</Heading>

          <Text style={paragraph}>
            Привет, {name}!
          </Text>

          <Text style={paragraph}>
            Спасибо за регистрацию в&nbsp;Geo&nbsp;Studio — платформе аналитики
            AI-видимости вашего бренда. Мы&nbsp;помогаем отслеживать, как ваш
            сайт цитируется в&nbsp;ChatGPT, Perplexity, Claude и&nbsp;других
            генеративных поисковых системах.
          </Text>

          <Text style={paragraph}>
            Создайте свой первый проект и&nbsp;запустите аналитический отчёт
            прямо сейчас:
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={dashboardUrl}>
              Перейти в панель
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Если у&nbsp;вас есть вопросы, напишите нам:{" "}
            <Link href="mailto:hello@geostudioai.ru" style={link}>
              hello@geostudioai.ru
            </Link>
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

const link: React.CSSProperties = {
  color: "#1a1a1a",
  textDecoration: "underline",
};

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
  Row,
  Column,
} from "@react-email/components";

interface TransactionEmailProps {
  name?: string;
  planName?: string;
  amount?: string;
  date?: string;
  dashboardUrl?: string;
}

export default function TransactionEmail({
  name = "Пользователь",
  planName = "Pro",
  amount = "990 ₽",
  date = "13 апреля 2026",
  dashboardUrl = "https://geostudioai.ru/dashboard",
}: TransactionEmailProps) {
  return (
    <Html lang="ru">
      <Head />
      <Preview>Чек об оплате — Geo Studio</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>Geo Studio</Text>

          <Heading style={heading}>Детали вашей транзакции</Heading>

          <Text style={paragraph}>
            Привет, {name}! Благодарим за оплату. Ниже — детали транзакции.
          </Text>

          {/* Receipt card */}
          <Section style={receiptCard}>
            <Row style={receiptRow}>
              <Column style={receiptLabel}>Тариф</Column>
              <Column style={receiptValue}>{planName}</Column>
            </Row>
            <Row style={receiptRowBorder}>
              <Column style={receiptLabel}>Сумма</Column>
              <Column style={receiptValue}>{amount}</Column>
            </Row>
            <Row style={receiptRowBorder}>
              <Column style={receiptLabel}>Дата</Column>
              <Column style={receiptValue}>{date}</Column>
            </Row>
            <Row style={receiptRowBorder}>
              <Column style={receiptLabel}>Статус</Column>
              <Column style={receiptValueGreen}>Оплачено ✓</Column>
            </Row>
          </Section>

          <Text style={paragraph}>
            Кредиты зачислены на ваш баланс. Вы&nbsp;можете начать использовать
            их&nbsp;прямо сейчас.
          </Text>

          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Перейти в панель
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Плательщик&nbsp;НПД Изыгашев&nbsp;Георгий&nbsp;Олегович ·
            ИНН&nbsp;425201762001
          </Text>

          <Text style={footer}>
            По вопросам оплаты:{" "}
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

const receiptCard: React.CSSProperties = {
  backgroundColor: "#F7F6F3",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
};

const receiptRow: React.CSSProperties = {
  padding: "8px 0",
};

const receiptRowBorder: React.CSSProperties = {
  padding: "8px 0",
  borderTop: "1px solid #EAEAEA",
};

const receiptLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#787774",
  width: "40%",
  verticalAlign: "top",
};

const receiptValue: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#1a1a1a",
  textAlign: "right" as const,
  width: "60%",
  verticalAlign: "top",
};

const receiptValueGreen: React.CSSProperties = {
  ...receiptValue,
  color: "#22863a",
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

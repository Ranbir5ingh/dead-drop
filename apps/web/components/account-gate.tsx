import Link from "next/link";

export function AccountGate({
  next,
  kicker,
  title,
  detail,
}: {
  next: string;
  kicker: string;
  title: string;
  detail: string;
}) {
  const query = encodeURIComponent(next);
  return (
    <div className="gate">
      <p className="eyebrow">{kicker}</p>
      <h1>{title}</h1>
      <p className="deck">{detail}</p>
      <div className="actions">
        <Link className="chunk" href={`/login?next=${query}`}>
          Log in
        </Link>
        <Link className="chunk paper" href={`/signup?next=${query}`}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

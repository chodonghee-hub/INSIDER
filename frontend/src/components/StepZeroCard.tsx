interface StepZeroCardProps {
  message: string;
}

export function StepZeroCard({ message }: StepZeroCardProps) {
  return (
    <section className="card step0-card">
      <h2>우리 아이 나이대는 지금, 이런 시기예요</h2>
      <p>{message}</p>
    </section>
  );
}

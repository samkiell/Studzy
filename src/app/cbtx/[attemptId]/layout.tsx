import { QuizProvider } from "@/context/QuizContext";

export default function PublicCbtLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuizProvider>
      {children}
    </QuizProvider>
  );
}

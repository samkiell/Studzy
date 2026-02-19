import { QuizProvider } from "@/context/QuizContext";

export default function CbtLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuizProvider>
      {children}
    </QuizProvider>
  );
}

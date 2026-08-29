import { useAppSelector } from "@/app/hooks";
import { selectView } from "@/features/typing/state/typingSlice";
import { Layout } from "@/shared/components/Layout/Layout";
import { TypingTest } from "@/features/typing/components/TypingTest/TypingTest";
import { HomeScreen } from "@/features/home/components/HomeScreen/HomeScreen";

export function App() {
  const view = useAppSelector(selectView);

  return (
    <Layout>
      {view === "home" ? <HomeScreen /> : <TypingTest />}
    </Layout>
  );
}

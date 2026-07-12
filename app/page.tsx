export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">WASA調整君</h1>
      <p className="text-center text-gray-600">
        WASAの班ミーティング調整用の日程調整アプリ(開発中)
      </p>
      <a
        href="/mock"
        className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white active:bg-green-700"
      >
        グリッドUIモックを試す
      </a>
    </main>
  );
}

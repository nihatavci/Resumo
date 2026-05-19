export default function OnboardingPage() {
  return (
    <main className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-dia-heading font-light text-foreground">
          Welcome to Resumo
        </h1>
        <p className="text-dia-subheading text-dia-body">
          Upload your CV and we&apos;ll build your career profile together.
        </p>
      </div>
    </main>
  );
}

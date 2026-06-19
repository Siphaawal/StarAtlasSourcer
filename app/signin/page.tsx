import { config } from "@/auth";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in — Star Atlas Sourcer" };

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="panel p-8">
        <h1 className="mb-1 text-2xl font-bold">
          Enter the <span className="glow-cyan text-[#34e0ff]">Sourcer</span>
        </h1>
        <p className="mb-6 text-sm text-[#8da2c7]">
          Sign in to submit assets, upvote the community, and climb the AEP leaderboard.
        </p>
        <SignInForm devEnabled={config.devLoginEnabled} discordEnabled={config.discordConfigured} />
      </div>
    </div>
  );
}

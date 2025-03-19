const PromptSuggestion = ({ icon, purpose, question }) => (
  <div className="flex-shrink-0 flex gap-2 p-4 pr-8 bg-[#88888C33;] rounded-lg">
    {icon}
    <div className="text-sm text-gray-200">
      {purpose}
      <div className="text-gray-450">{question}</div>
    </div>
  </div>
);

export default function PromptSuggestions() {
  return (
    <>
      <PromptSuggestion
        icon="⛅"
        purpose="I'm updating my wardrobe for fall."
        question="What are some staple items I should add?"
      />
      <PromptSuggestion
        icon="🍴"
        purpose="I have eggs, tomatoes and onions."
        question="What are 5 dishes I can make?"
      />
      <PromptSuggestion
        icon="🖥️"
        purpose="I'm prepping for a job interview."
        question="Can you role play with me to help me prepare?"
      />
    </>
  );
}

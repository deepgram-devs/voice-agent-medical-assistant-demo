import { defaultVoice } from "app/lib/constants";
import type { StsConfig } from "app/utils/deepgramUtils";
import { useCallback, useState } from "react";

export const useStsQueryParams = () => {
  const [params, setParams] = useState<{
    voice: string;
    instructions: string | null;
    provider: string | null;
    model: string | null;
    temp: string | null;
    rep_penalty: string | null;
    tts_provider: string | null;
    keyterm: string[] | null;
  }>({
    voice: defaultVoice.canonical_name,
    instructions: null,
    provider: null,
    model: null,
    temp: null,
    rep_penalty: null,
    tts_provider: null,
    keyterm: null,
  });

  const applyParamsToConfig = useCallback(
    (config: StsConfig) => {
      const { voice, instructions, provider, model, temp, rep_penalty, tts_provider, keyterm } = params;
      return {
        ...config,
        agent: {
          ...config.agent,
          listen: {
            ...config.agent.listen,
            ...{ keyterms: Array.isArray(keyterm) ? keyterm : keyterm ? [keyterm] : [] },
          },
          think: {
            ...config.agent.think,
            ...(provider && model && { provider: { type: provider }, model }),
            ...(instructions && {
              instructions: `${config.agent.think.instructions}\n${instructions}`,
            }),
          },
          speak: {
            ...(voice
              ? tts_provider
                ? { voice_id: voice, provider: tts_provider }
                : { model: voice }
              : config.agent.speak),
            ...(temp && { temp: parseFloat(temp) }),
            ...(rep_penalty && { rep_penalty: parseFloat(rep_penalty) }),
          },
        },
      };
    },
    [params],
  );

  const updateInstructionsUrlParam = useCallback(
    (text: string | null) => {
      setParams(prev => ({ ...prev, instructions: text }));
    },
    [],
  );

  const updateVoiceUrlParam = useCallback(
    (voice: string) => {
      setParams(prev => ({ ...prev, voice }));
    },
    [],
  );

  return {
    ...params,
    applyParamsToConfig,
    updateInstructionsUrlParam,
    updateVoiceUrlParam,
  };
};

import { useQuery, useMutation, useAction } from "convex/react";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";

export function useMlService() {
  const modelMetrics = useQuery(api.ml.models.getMetrics) ?? [];
  const activeModelConfig = useQuery(api.ml.models.getActiveModel);

  const triggerTraining = useAction(api.ml.training.triggerTraining);
  const predictAll = useAction(api.ml.predictions.predictAll);
  const predictSingle = useAction(api.ml.predictions.predictSingle);
  const setActiveModel = useMutation(api.ml.models.setActiveModel);
  const checkHealth = useAction(api.ml.models.checkHealth);

  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  const [mlHealth, setMlHealth] = useState<{
    online: boolean;
    trained: boolean;
    checked: boolean;
  }>({ online: false, trained: false, checked: false });

  const refreshHealth = useCallback(async () => {
    try {
      const result = await checkHealth();
      setMlHealth({ online: result.online, trained: result.trained, checked: true });
    } catch {
      setMlHealth({ online: false, trained: false, checked: true });
    }
  }, [checkHealth]);

  // Poll ML service health every 30 seconds
  useEffect(() => {
    void refreshHealth();
    const interval = setInterval(() => void refreshHealth(), 30_000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const handleTrain = useCallback(async () => {
    setIsTraining(true);
    try {
      await triggerTraining();
      await refreshHealth();
    } finally {
      setIsTraining(false);
    }
  }, [triggerTraining, refreshHealth]);

  const handlePredictAll = useCallback(async () => {
    setIsPredicting(true);
    try {
      await predictAll();
    } finally {
      setIsPredicting(false);
    }
  }, [predictAll]);

  return {
    modelMetrics: modelMetrics as Doc<"modelMetrics">[],
    activeModelConfig,
    isTraining,
    isPredicting,
    mlHealth,
    handleTrain,
    handlePredictAll,
    predictSingle,
    setActiveModel,
    refreshHealth,
  };
}

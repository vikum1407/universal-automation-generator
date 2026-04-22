import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function InitializingProject() {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      navigate(`/projects/${id}`, { replace: true });
    }
  }, [id, navigate]);

  return null;
}

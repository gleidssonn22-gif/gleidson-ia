class SecurityGuardrails:
    def __init__(self):
        # Lista simples de termos bloqueados (pode ser expandida ou integrada com APIs de moderação)
        self.blocked_terms = ["palavrao_exemplo1", "conteudo_proibido"]

    def validate_input(self, user_message: str) -> tuple[bool, str]:
        message_lower = user_message.lower()
        
        for term in self.blocked_terms:
            if term in message_lower:
                return False, "Sua mensagem contém termos que violam as políticas de segurança do assistente."
                
        return True, ""

security_guardrails = SecurityGuardrails()
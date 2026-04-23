from slowapi import Limiter
from slowapi.util import get_remote_address
 
# Shared limiter instance — imported by main.py AND all routers
# Keeping it here breaks the circular import:
#   main.py → routers/auth.py → main.py  ← was the problem
#   main.py → routers/auth.py → limiter.py  ← fixed
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2000/minute"],
    storage_uri="memory://",
)
 
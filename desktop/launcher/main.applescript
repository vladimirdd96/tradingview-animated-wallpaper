on run
    set resourceDirectory to POSIX path of (path to resource "launch.sh")
    try
        with timeout of 90 seconds
            do shell script "/bin/zsh " & quoted form of resourceDirectory
        end timeout
    on error errorMessage number errorNumber
        if errorNumber is not -128 then
            display dialog errorMessage with title "TradingView Wallpaper" buttons {"Close"} default button "Close" with icon caution
        end if
    end try
end run
